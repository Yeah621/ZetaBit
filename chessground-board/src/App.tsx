import { Route, Routes } from 'react-router';
import Home from './pages/Home';
import Game from './pages/Game';
import FriendLobby from './pages/FriendLobby';
import FriendRoom from './pages/FriendRoom';

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="local" element={<Game mode="local" />} />
      <Route path="friend" element={<FriendLobby />} />
      <Route path="friend/:code" element={<FriendRoom />} />
    </Routes>
  );
}
