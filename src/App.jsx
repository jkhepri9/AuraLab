import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';

// Import Pages from the new 'pages' folder
import Home from './pages/Home';
import Install from './pages/Install';
import AuraGenerator from './pages/AuraGenerator';
import AuraConverter from './pages/AuraConverter';
import AuraModes from './pages/AuraModes';
import AuraEditor from './pages/AuraEditor';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Install" element={<Install />} />
          <Route path="/AuraGenerator" element={<AuraGenerator />} />
          <Route path="/AuraConverter" element={<AuraConverter />} />
          <Route path="/AuraModes" element={<AuraModes />} />
          <Route path="/AuraEditor" element={<AuraEditor />} />
        </Routes>
      </Layout>
    </Router>
  );
}