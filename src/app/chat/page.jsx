
import ChatPortal from '../../ui-pages/ChatPortal';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function Page() {
  return <ProtectedRoute><ChatPortal /></ProtectedRoute>;
}
