import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({base:'/TalentIQ/',plugins:[react()],resolve:{preserveSymlinks:true},server:{port:5173}});
