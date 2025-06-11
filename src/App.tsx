import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Cadastros from './pages/Cadastros';
import Home from './pages/Home';
import Vendas from './pages/Vendas';
import DespesasVendas from './pages/DespesasVendas';
import Analise from './pages/Analise';
import AnaliseVendas from './pages/AnaliseVendas';
import Graficos from './pages/Graficos';
import Evolucao from './pages/Evolucao';
import Dre from './pages/Dre';
import Configuracoes from './pages/Configuracoes';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<Home />} />
                <Route path="vendas" element={<Vendas />} />
                <Route path="despesas-vendas" element={<DespesasVendas />} />
                <Route path="analise" element={<Analise />} />
                <Route path="analise-vendas" element={<AnaliseVendas />} />
                <Route path="graficos" element={<Graficos />} />
                <Route path="evolucao" element={<Evolucao />} />
                <Route path="dre" element={<Dre />} />
                <Route path="profile" element={<Profile />} />
                <Route path="cadastros" element={<Cadastros />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }>
          <Route path="/" />
          <Route path="/vendas" />
          <Route path="/despesas-vendas" />
          <Route path="/analise" />
          <Route path="/analise-vendas" />
          <Route path="/graficos" />
          <Route path="/evolucao" />
          <Route path="/dre" />
          <Route path="/profile" />
          <Route path="/cadastros" />
          <Route path="/configuracoes" />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;