
import CreateRequest from '../../ui-pages/CreateRequest';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function Page() {
  return <ProtectedRoute><CreateRequest /></ProtectedRoute>;
}
