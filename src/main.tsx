import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "@/app/store";
import { router } from "@/app/router";
import { ThemeBootstrap } from "@/components/layout/ThemeBootstrap";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ThemeBootstrap />
    <RouterProvider router={router} />
  </Provider>,
);
