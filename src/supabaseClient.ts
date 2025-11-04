// filepath: src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://emclmyzcpjkjopirwwym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtY2xteXpjcGpram9waXJ3d3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDkzNTgsImV4cCI6MjA3Njg4NTM1OH0.SWF2Az_b4peg9Io4HX-DF-GzDmMN-2oEFLfN3YA6qN8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);