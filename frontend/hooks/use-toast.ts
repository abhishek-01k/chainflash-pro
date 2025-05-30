import { toast } from "sonner"

export const useToast = () => {
  return {
    toast: (options: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      if (options.variant === "destructive") {
        return toast.error(options.title, {
          description: options.description,
        });
      }
      return toast.success(options.title, {
        description: options.description,
      });
    }
  };
}; 