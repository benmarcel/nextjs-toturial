import postgres from 'postgres';
import  { supabase } from '../../config/db';
// const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// async function listInvoices() {
// 	const data = await sql`
//     SELECT invoices.amount, customers.name
//     FROM invoices
//     JOIN customers ON invoices.customer_id = customers.id
//     WHERE invoices.amount = 666;
//   `;

// 	return data;
// } 



async function listInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('amount, customers(name)')
    .eq('amount', 666);

  if (error) {
    throw error;
  }

  return data;
}

// GET /api/query
export async function GET() {
  
  try {
  	return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}