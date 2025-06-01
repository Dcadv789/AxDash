import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Cadastros from './pages/Cadastros';
import Home from './pages/Home';
import Vendas from './pages/Vendas';
import Analise from './pages/Analise';
import AnaliseVendas from './pages/AnaliseVendas';
import Graficos from './pages/Graficos';
import Evolucao from './pages/Evolucao';
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
                <Route path="analise" element={<Analise />} />
                <Route path="analise-vendas" element={<AnaliseVendas />} />
                <Route path="graficos" element={<Graficos />} />
                <Route path="evolucao" element={<Evolucao />} />
                <Route path="profile" element={<Profile />} />
                <Route path="cadastros" element={<Cadastros />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }>
          <Route path="/" />
          <Route path="/vendas" />
          <Route path="/analise" />
          <Route path="/analise-vendas" />
          <Route path="/graficos" />
          <Route path="/evolucao" />
          <Route path="/profile" />
          <Route path="/cadastros" />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;