"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TaskView } from "@/lib/types";
import { createTask, toggleTask, deleteTask } from "@/app/area-da-nic/painel/agenda/actions";

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" });
}

function isOverdue(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(iso) < today;
}

export default function TaskList({ tasks }: { tasks: TaskView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const add = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask(title, due || null);
      setTitle("");
      setDue("");
      router.refresh();
      toast.success("Tarefa adicionada.");
    });
  };

  const toggle = (id: string, done: boolean) =>
    startTransition(async () => {
      await toggleTask(id, done);
      router.refresh();
    });

  const remove = (id: string) =>
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nova tarefa — ex: terminar a Bolsa da Duda"
          className="flex-1 min-w-[220px] bg-white border border-line-input rounded-[12px] px-[15px] py-[12px] text-[15px] text-ink outline-none focus:border-sage"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Prazo (opcional)"
          className="bg-white border border-line-input rounded-[12px] px-[12px] py-[12px] text-[14px] text-muted-nav outline-none focus:border-sage"
        />
        <button
          onClick={add}
          disabled={pending || !title.trim()}
          className="btn-pill bg-ink text-cream px-6 py-[12px] hover:bg-sage disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Adicionar
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-[14px] text-muted-soft">Nenhuma tarefa por aqui. Que tal começar uma?</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 bg-panel-card border border-line-card rounded-[12px] px-4 py-3"
            >
              <button
                onClick={() => toggle(t.id, !t.done)}
                disabled={pending}
                aria-label={t.done ? "Marcar como não feita" : "Concluir tarefa"}
                className={`grid place-items-center w-[22px] h-[22px] rounded-[6px] border flex-none transition-colors ${
                  t.done ? "bg-sage border-sage text-cream" : "border-line bg-white text-transparent"
                }`}
              >
                ✓
              </button>
              <span
                className={`flex-1 text-[15px] ${t.done ? "line-through text-muted-soft" : "text-ink"}`}
              >
                {t.title}
              </span>
              {t.dueDate && (
                <span
                  className={`text-[12px] px-[10px] py-[4px] rounded-[20px] border whitespace-nowrap ${
                    !t.done && isOverdue(t.dueDate)
                      ? "bg-[#C06A4A]/10 text-[#C06A4A] border-[#C06A4A]/40"
                      : "bg-line-divider text-muted-soft border-line"
                  }`}
                >
                  {formatDue(t.dueDate)}
                </span>
              )}
              <button
                onClick={() => remove(t.id)}
                disabled={pending}
                aria-label="Excluir tarefa"
                className="text-muted-soft hover:text-[#C06A4A] transition-colors text-[16px] flex-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
