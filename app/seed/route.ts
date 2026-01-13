import bcrypt from 'bcrypt';
// import postgres from 'postgres';

import { invoices, customers, revenue, users } from '../lib/placeholder-data';

import { supabase } from '../../config/db'; 
// const sql = postgres(process.env.POSTGRES_URL!,  { ssl: 'verify-full' });

// async function seedUsers() {
//   await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
//   await sql`
//     CREATE TABLE IF NOT EXISTS users (
//       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//       name VARCHAR(255) NOT NULL,
//       email TEXT NOT NULL UNIQUE,
//       password TEXT NOT NULL
//     );
//   `;

//   const insertedUsers = await Promise.all(
//     users.map(async (user) => {
//       const hashedPassword = await bcrypt.hash(user.password, 10);
//       return sql`
//         INSERT INTO users (id, name, email, password)
//         VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
//         ON CONFLICT (id) DO NOTHING;
//       `;
//     }),
//   );

//   return insertedUsers;
// }

// async function seedInvoices() {
//   await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

//   await sql`
//     CREATE TABLE IF NOT EXISTS invoices (
//       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//       customer_id UUID NOT NULL,
//       amount INT NOT NULL,
//       status VARCHAR(255) NOT NULL,
//       date DATE NOT NULL
//     );
//   `;

//   const insertedInvoices = await Promise.all(
//     invoices.map(
//       (invoice) => sql`
//         INSERT INTO invoices (customer_id, amount, status, date)
//         VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
//         ON CONFLICT (id) DO NOTHING;
//       `,
//     ),
//   );

//   return insertedInvoices;
// }

// async function seedCustomers() {
//   await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

//   await sql`
//     CREATE TABLE IF NOT EXISTS customers (
//       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//       name VARCHAR(255) NOT NULL,
//       email VARCHAR(255) NOT NULL,
//       image_url VARCHAR(255) NOT NULL
//     );
//   `;

//   const insertedCustomers = await Promise.all(
//     customers.map(
//       (customer) => sql`
//         INSERT INTO customers (id, name, email, image_url)
//         VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
//         ON CONFLICT (id) DO NOTHING;
//       `,
//     ),
//   );

//   return insertedCustomers;
// }

// async function seedRevenue() {
//   await sql`
//     CREATE TABLE IF NOT EXISTS revenue (
//       month VARCHAR(4) NOT NULL UNIQUE,
//       revenue INT NOT NULL
//     );
//   `;

//   const insertedRevenue = await Promise.all(
//     revenue.map(
//       (rev) => sql`
//         INSERT INTO revenue (month, revenue)
//         VALUES (${rev.month}, ${rev.revenue})
//         ON CONFLICT (month) DO NOTHING;
//       `,
//     ),
//   );

//   return insertedRevenue;
// }

// export async function GET() {
//   try {
//     // Run seeds one by one to ensure the DB wakes up
//     // and doesn't struggle with multiple concurrent table creations
//     await seedUsers();
//     await seedCustomers();
//     await seedInvoices();
//     await seedRevenue();

//     return Response.json({ message: 'Database seeded successfully' });
//   } catch (error: any) {
//     console.error('Error seeding database:', error);
//     // This will help you see if it's a password error or a timeout
//     return Response.json({ 
//       error: error.message, 
//       code: error.code 
//     }, { status: 500 });
//   }
// }

async function seedUsers() {
  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 10),
    }))
  );

  const { error } = await supabase
    .from('users')
    .upsert(usersWithHashedPasswords, { onConflict: 'id' });

  if (error) throw error;
}

async function seedCustomers() {
  const { error } = await supabase
    .from('customers')
    .upsert(customers, { onConflict: 'id' });

  if (error) throw error;
}

async function seedInvoices() {
  const { error } = await supabase
    .from('invoices')
    .upsert(invoices, { onConflict: 'id' });

  if (error) throw error;
}


async function seedRevenue() {
  const { error } = await supabase
    .from('revenue')
    .upsert(revenue, { onConflict: 'month' });

  if (error) throw error;
}

export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}