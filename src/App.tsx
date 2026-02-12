import Editor from "./components/Editor/Editor";

import 'react-time-picker/dist/TimePicker.css';

export default function App() {
  const pathname = window.location.pathname || "/";
  // normalize trailing slash
  const path = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  // route: /editor/:id
  if (path.startsWith("/editor/")) {
    const id = path.split("/").pop() || "new";
    return <Editor id={id} />;
  }

  // optional viewer route if you support /viewer/:id
  /* if (path.startsWith("/viewer/")) {
    const id = path.split("/").pop() || "";
    return <Viewer id={id} />;
  } */

  // default redirect / -> /editor/new (replace history)
  window.history.replaceState(null, "", "/editor/new");

  return null; // no render on this pass; browser will have updated location
}
