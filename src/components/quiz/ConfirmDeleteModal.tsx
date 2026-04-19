import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open, title = "Delete Room?", message = "Are you sure you want to delete this room? All participants will be disconnected.",
  busy, onCancel, onConfirm,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-strong w-full max-w-sm p-6 relative"
          >
            <button onClick={onCancel} className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{message}</p>
            <div className="flex gap-2">
              <button onClick={onCancel} disabled={busy} className="flex-1 px-4 py-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 text-foreground font-semibold text-sm transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={busy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold text-sm transition-colors disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
