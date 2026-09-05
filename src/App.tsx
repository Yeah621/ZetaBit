import { Route, Routes } from 'react-router';
import Home from './pages/Home';
import Game from './pages/Game';

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="local" element={<Game mode="local" />} />
    </Routes>
  );
}
