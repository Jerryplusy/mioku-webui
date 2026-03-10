import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { store } from "@/app/store";
import { router } from "@/app/router";
import { ThemeBootstrap } from "@/components/layout/ThemeBootstrap";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ThemeBootstrap />
    <RouterProvider router={router} />
    <Toaster
      position="bottom-right"
      closeButton
      duration={3000}
      theme="system"
      toastOptions={{
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          borderColor: "hsl(var(--border))",
        },
        classes: {
          error: "!bg-red-500/10 !border-red-500/30",
          warning: "!bg-yellow-500/10 !border-yellow-500/30",
          success: "!bg-green-500/10 !border-green-500/30",
          info: "!bg-blue-500/10 !border-blue-500/30",
        },
      }}
    />
  </Provider>,
);

export { toast };
