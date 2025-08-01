import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-treatment.ts';
import '@/ai/flows/diagnose-disease.ts';