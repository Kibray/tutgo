{
  /* Модальное окно с деталями записи */
}
<AnimatePresence>
  {selectedAppt && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
      onClick={() => setSelectedAppt(null)}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-t-2xl w-full max-w-md p-5 pb-10 border-t border-border"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold font-display text-foreground">Детали записи</h2>
          <button onClick={() => setSelectedAppt(null)} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <span
          className={`text-[10px] font-medium px-2.5 py-1 rounded-md ${STATUS_COLORS[selectedAppt.status] || "text-muted-foreground bg-muted"}`}
        >
          {STATUS_LABELS[selectedAppt.status] || selectedAppt.status}
        </span>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Клиент</p>
              <p className="text-sm font-semibold text-foreground">{selectedAppt.client_name || "Не указано"}</p>
            </div>
          </div>

          {selectedAppt.client_phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Телефон</p>
                <p className="text-sm font-semibold text-foreground">{selectedAppt.client_phone}</p>
              </div>
            </div>
          )}

          {selectedAppt.service && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Scissors className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Услуга</p>
                <p className="text-sm font-semibold text-foreground">{(selectedAppt.service as any).name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Время</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(selectedAppt.start_time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })} —{" "}
                {new Date(selectedAppt.end_time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>

        {selectedAppt.status === "pending" && (
          <div className="flex gap-3 mt-5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={updating}
              onClick={() => updateStatus(selectedAppt.id, "cancelled")}
              className="flex-1 py-3 rounded-lg glass border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Отклонить
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={updating}
              onClick={() => updateStatus(selectedAppt.id, "confirmed")}
              className="flex-1 py-3 rounded-lg bg-primary text-accent-foreground text-sm font-semibold flex items-center justify-center gap-1.5 glow-green disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Принять
            </motion.button>
          </div>
        )}

        {selectedAppt.status === "confirmed" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={updating}
            onClick={() => updateStatus(selectedAppt.id, "cancelled")}
            className="w-full mt-5 py-3 rounded-lg glass border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Отменить запись
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>;
