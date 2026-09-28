import { AppHeader } from './app-header';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  return <AppHeader actions={<ThemeToggle />} />;
}
export default Navbar;
