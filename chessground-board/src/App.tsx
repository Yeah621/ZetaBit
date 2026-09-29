import { Route, Routes } from 'react-router';
import Home from './pages/Home';
import Game from './pages/Game';
import FriendLobby from './pages/FriendLobby';
import FriendRoom from './pages/FriendRoom';

// Router root - cuma <Routes>, bukan tempat logic (logic ada di masing-masing page/hook).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/local" element={<Game />} />
      <Route path="/friend" element={<FriendLobby />} />
      <Route path="/friend/:code" element={<FriendRoom />} />
    </Routes>
  );
}
