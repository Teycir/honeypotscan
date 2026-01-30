import { fetchContractSource } from '../lib/fetcher.js';
import { detectHoneypot } from '../lib/detector.js';
import { validateAddress, validateChain } from '../lib/validator.js';
import { detectChain } from '../lib/chain-detector.js';

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }
    
    try {
      const { address } = await request.json();
      
      // Validate input
      const addressValidation = validateAddress(address);
      if (!addressValidation.valid) {
        return new Response(
          JSON.stringify({ error: addressValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Auto-detect chain
      const chain = await detectChain(address);
      if (!chain) {
        return new Response(
          JSON.stringify({ error: 'Contract not found on supported chains' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check cache
      const cacheKey = `${chain}:${address.toLowerCase()}`;
      const cached = await env.CACHE?.get(cacheKey, 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Fetch source code
      const source = await fetchContractSource(address, chain, env);
      
      if (!source) {
        return new Response(
          JSON.stringify({ error: 'Contract source code not available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Detect honeypot
      const { isHoneypot, patterns } = detectHoneypot(source);
      
      const result = {
        isHoneypot,
        confidence: isHoneypot ? 95 : 100,
        patterns,
        chain,
        message: isHoneypot
          ? `⚠️ This contract contains ${patterns.length} honeypot patterns. DO NOT BUY!`
          : '✅ No honeypot patterns detected. Contract appears safe.',
      };
      
      // Cache result (24 hours)
      await env.CACHE?.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message || 'Scan failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
