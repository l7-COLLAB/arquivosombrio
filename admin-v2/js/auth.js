import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,ADMIN_STORAGE_KEY,ADMIN_ROLE}from"./config.js";
let client;
export function getClient(){if(client)return client;if(!window.supabase?.createClient)throw new Error("Supabase não carregou.");client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{storageKey:ADMIN_STORAGE_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});return client}
export async function requireAdmin(){const c=getClient();const{data,error}=await c.auth.getSession();if(error)throw error;const session=data?.session;if(!session?.user||session.user.app_metadata?.role!==ADMIN_ROLE)return null;return session}
export async function signOut(){await getClient().auth.signOut()}