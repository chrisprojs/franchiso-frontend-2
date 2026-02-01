import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './page/Home';
import Login from './page/Login';
import Register from './page/Register';
import './App.css';
import Search from './page/Search';
import FranchiseDetail from './page/FranchiseDetail';
import Navbar from './component/Navbar';
import Profile from './page/Profile';
import FranchisorDashboard from './page/FranchisorDashboard';
import AdminDashboard from './page/AdminDashboard';
import FranchiseVerificationDetail from './page/FranchiseVerificationDetail';
import AdminFranchiseVerificationDetail from './page/AdminFranchiseVerificationDetail';
import UploadFranchise from './page/UploadFranchise';
import EditFranchise from './page/EditFranchise';
import AboutUs from './page/AboutUs';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/dashboard/franchisor" element={<FranchisorDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/admin/franchise/:id/verify" element={<AdminFranchiseVerificationDetail />} />
        <Route path="/franchise/:id/verify" element={<FranchiseVerificationDetail />} />
        <Route path="/franchise/:id" element={<FranchiseDetail />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/franchise/upload" element={<UploadFranchise />} />
        <Route path="/franchise/:id/edit" element={<EditFranchise />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;
