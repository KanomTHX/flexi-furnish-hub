// Environment check utility
export const checkEnvironment = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasSupabase: !!process.env.VITE_SUPABASE_URL,
    timestamp: new Date().toISOString()
  };
};

export default { checkEnvironment };