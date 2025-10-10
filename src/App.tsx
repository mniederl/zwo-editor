// import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
// import Editor from './components/Editor/Editor';

import WarmupLogo from './assets/warmup.svg?react';

import './App.css';

/* export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/editor/:id" component={Editor} />
        <Route render={({ history }) => { history.replace('/editor/new'); return null; }} />
      </Switch>
    </Router>
  )
} */

// TODO: check if this would be sufficient:
export default function App() {
  const path = window.location.pathname;

  if (!path.startsWith('/editor/')) {
    window.history.replaceState(null, '', '/editor/new');
    return null;
  }

  const id = path.split('/').pop() || 'new';

  return <WarmupLogo />;

  // return <Editor id={id} />;
}
