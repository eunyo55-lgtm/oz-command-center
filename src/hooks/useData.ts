import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  mockSignals, mockCustomers, mockProducts, mockTasks, mockKPI
} from '../lib/mockData';
import type { Signal, Customer, Product, Task, KPISnapshot } from '../types';

interface DataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  source: 'supabase' | 'mock';
}

// ============ 전역 캐시 (탭 이동해도 유지) ============
const cache: {
  signals?: DataState<Signal[]>;
  customers?: DataState<Customer[]>;
  products?: DataState<Product[]>;
  tasks?: DataState<Task[]>;
  kpi?: DataState<KPISnapshot>;
} = {};

// 진행 중인 요청을 저장하여 중복 요청 방지
const pendingRequests: {
  customers?: Promise<void>;
} = {};

// ============ Signals ============
export function useSignals() {
  const [state, setState] = useState<DataState<Signal[]>>(
    cache.signals || {
      data: mockSignals,
      loading: isSupabaseConfigured,
      error: null,
      source: 'mock',
    }
  );

  useEffect(() => {
    if (cache.signals) return;
    if (!supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });

      let result: DataState<Signal[]>;

      if (error) {
        console.warn('[signals] Supabase error, falling back to mock:', error.message);
        result = { data: mockSignals, loading: false, error: error.message, source: 'mock' };
      } else if (!data || data.length === 0) {
        result = { data: mockSignals, loading: false, error: null, source: 'mock' };
      } else {
        result = { data: data as Signal[], loading: false, error: null, source: 'supabase' };
      }

      cache.signals = result;
      setState(result);
    })();
  }, []);

  return state;
}

// ============ Customers (전체 페이지네이션 + 캐시) ============
export function useCustomers() {
  const [state, setState] = useState<DataState<Customer[]>>(
    cache.customers || {
      data: mockCustomers,
      loading: isSupabaseConfigured,
      error: null,
      source: 'mock',
    }
  );

  useEffect(() => {
    // 이미 캐시가 있으면 재사용
    if (cache.customers) {
      setState(cache.customers);
      return;
    }

    if (!supabase) return;

    // 이미 진행 중인 요청이 있으면 그것을 기다림
    if (pendingRequests.customers) {
      pendingRequests.customers.then(() => {
        if (cache.customers) setState(cache.customers);
      });
      return;
    }

    const fetchCustomers = async () => {
      try {
        const PAGE_SIZE = 1000;
        let allData: Customer[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error } = await supabase!
            .from('customers')
            .select('*')
            .order('signup_date', { ascending: false })
            .range(from, to);

          if (error) throw error;

          if (!data || data.length === 0) {
            hasMore = false;
            break;
          }

          allData = allData.concat(data as Customer[]);
          if (data.length < PAGE_SIZE) hasMore = false;
          page++;
          if (page > 100) hasMore = false;
        }

        let result: DataState<Customer[]>;
        if (allData.length === 0) {
          result = { data: mockCustomers, loading: false, error: null, source: 'mock' };
        } else {
          console.log(`[customers] Loaded ${allData.length} customers from Supabase`);
          result = { data: allData, loading: false, error: null, source: 'supabase' };
        }

        cache.customers = result;
        setState(result);
      } catch (err: any) {
        console.warn('[customers] Supabase error, falling back to mock:', err.message);
        const result: DataState<Customer[]> = {
          data: mockCustomers,
          loading: false,
          error: err.message,
          source: 'mock',
        };
        cache.customers = result;
        setState(result);
      } finally {
        delete pendingRequests.customers;
      }
    };

    pendingRequests.customers = fetchCustomers();
  }, []);

  return state;
}

// 수동으로 캐시 초기화 (업로드 후 사용)
export function clearCustomersCache() {
  delete cache.customers;
}

// ============ Products ============
export function useProducts() {
  const [state, setState] = useState<DataState<Product[]>>(
    cache.products || {
      data: mockProducts,
      loading: isSupabaseConfigured,
      error: null,
      source: 'mock',
    }
  );

  useEffect(() => {
    if (cache.products) return;
    if (!supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sales_velocity', { ascending: false });

      let result: DataState<Product[]>;
      if (error) {
        console.warn('[products] Supabase error:', error.message);
        result = { data: mockProducts, loading: false, error: error.message, source: 'mock' };
      } else if (!data || data.length === 0) {
        result = { data: mockProducts, loading: false, error: null, source: 'mock' };
      } else {
        result = { data: data as Product[], loading: false, error: null, source: 'supabase' };
      }

      cache.products = result;
      setState(result);
    })();
  }, []);

  return state;
}

// ============ Tasks ============
export function useTasks() {
  const [state, setState] = useState<DataState<Task[]>>(
    cache.tasks || {
      data: mockTasks,
      loading: isSupabaseConfigured,
      error: null,
      source: 'mock',
    }
  );

  useEffect(() => {
    if (cache.tasks) return;
    if (!supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      let result: DataState<Task[]>;
      if (error) {
        console.warn('[tasks] Supabase error:', error.message);
        result = { data: mockTasks, loading: false, error: error.message, source: 'mock' };
      } else if (!data || data.length === 0) {
        result = { data: mockTasks, loading: false, error: null, source: 'mock' };
      } else {
        result = { data: data as Task[], loading: false, error: null, source: 'supabase' };
      }

      cache.tasks = result;
      setState(result);
    })();
  }, []);

  return state;
}

// ============ KPI (from RPC) ============
export function useKPI() {
  const [state, setState] = useState<DataState<KPISnapshot>>(
    cache.kpi || {
      data: mockKPI,
      loading: isSupabaseConfigured,
      error: null,
      source: 'mock',
    }
  );

  useEffect(() => {
    if (cache.kpi) return;
    if (!supabase) return;

    (async () => {
      const { data, error } = await supabase.rpc('get_kpi_snapshot');

      let result: DataState<KPISnapshot>;
      if (error || !data || data.length === 0) {
        if (error) console.warn('[kpi] RPC error:', error.message);
        result = { data: mockKPI, loading: false, error: error?.message || null, source: 'mock' };
      } else {
        const row = data[0];
        result = {
          data: {
            ...mockKPI,
            total_customers: row.total_customers ?? mockKPI.total_customers,
            vip_customers: row.vip_customers ?? mockKPI.vip_customers,
            active_signals: row.active_signals ?? mockKPI.active_signals,
            resolved_signals_7d: row.resolved_signals_7d ?? mockKPI.resolved_signals_7d,
            new_signup_repurchase_rate: row.new_signup_repurchase_rate ?? mockKPI.new_signup_repurchase_rate,
            app_revenue_share: row.app_revenue_share ?? mockKPI.app_revenue_share,
          },
          loading: false,
          error: null,
          source: 'supabase',
        };
      }

      cache.kpi = result;
      setState(result);
    })();
  }, []);

  return state;
}