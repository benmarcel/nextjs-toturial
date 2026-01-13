import postgres from 'postgres';

import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { supabase } from '@/config/db';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
// const sql = neon(process.env.POSTGRES_URL!);

export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const { data, error } = await supabase
      .from('revenue')
      .select('*');

    console.log('Data fetch completed after 3 seconds.');

    if (error) {
      throw error;
    }
    return data as Revenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices(){
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`id, amount, status, customers(name, email, image_url)`)
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }
    const latestInvoices = (data ?? []).map((invoice: any) => {
      const customer = Array.isArray(invoice.customers)
        ? invoice.customers[0]
        : invoice.customers;

      return {
        id: invoice.id,
        amount: typeof invoice.amount === 'string' ? formatCurrency(Number(invoice.amount)) : invoice.amount,
        status: invoice.status,
        // these keys must match LatestInvoiceRaw exactly
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        image_url: customer?.image_url ?? null,
      } 
    });

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true });
    
    const customerCountPromise = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });

    const invoiceStatusPromise = supabase
      .from('invoice_status_summary') // Assuming you created this View
      .select('paid, pending')
      .single();

    // 1. Fire all queries in parallel
    const responses = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    // 2. Extract correctly from the response objects
    const numberOfInvoices = Number(responses[0].count ?? '0');
    const numberOfCustomers = Number(responses[1].count ?? '0');
    
    // For .single(), we look inside the 'data' property
    const totalPaidInvoices = formatCurrency(responses[2].data?.paid ?? '0');
    const totalPendingInvoices = formatCurrency(responses[2].data?.pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
   const { data: invoices, error } = await supabase.rpc(
  'search_invoices',
  {
    search_query: query,
    limit_count: ITEMS_PER_PAGE,
    offset_count: offset,
  }
);

if (error) throw error;

return invoices as InvoicesTable[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const { data, error } = await supabase.rpc('get_invoices_count', { 
      search_text: query 
    });

    if (error) throw error;

    const totalPages = Math.ceil(Number(data) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    return 0;
  }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, customer_id, amount, status')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Invoice not found');
    }

    const invoice = {
      ...data,
      // Convert amount from cents to dollars
      amount: data.amount / 100,
    };

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers(): Promise<CustomerField[]> {
  try {
    const {data, error} = await supabase
      .from('customers')
      .select('id, name')
      .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
    return data as CustomerField[];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const { data, error } = await supabase
      .from('customer_stats_view')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform the data (Formatting currency)
    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending ?? 0),
      total_paid: formatCurrency(customer.total_paid ?? 0),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
