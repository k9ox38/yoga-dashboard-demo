import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StoreProvider } from "./store";

// The demo data lives above the router so it survives signing out and back in, like server data would.
export default function App() {
  return (
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  );
}
