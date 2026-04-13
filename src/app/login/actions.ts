'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function saveCookie(token: string, branch: string, merchant: string) {
  const cookieStore = await cookies();
  cookieStore.set('token', token);
  cookieStore.set('branch_id', branch);
  cookieStore.set('merchant_id', merchant);
  redirect('/orders');
}
