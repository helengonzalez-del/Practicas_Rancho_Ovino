// config.js — Conexión con Supabase

const { createClient } = supabase;
const SUPABASE_URL = 'https://kjfwpqookkpxkqhsmikk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZndwcW9va2tweGtxaHNtaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjM1NTEsImV4cCI6MjA4OTY5OTU1MX0.pfcsHxpLO-fizYFxI1wSxTANQxqDnGvZXmACbekKhvk';
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let animalesCache = [];
let ventasCache = [];
