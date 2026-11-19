import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { signOut } from "../lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

/** Asks before signing out, then clears the session and shows the signed-out page. */
export function LogoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const confirm = () => {
    const previous = signOut();
    navigate("/logout", { replace: true, state: { signedInAt: previous?.signedInAt } });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] gap-5 rounded-2xl border-stone-200 bg-white p-6 sm:max-w-sm">
        <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-600"><LogOut className="size-5" /></span>
          <AlertDialogTitle className="text-base font-semibold text-stone-900">退出登录？</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-stone-500">退出后需要重新输入用户名和密码才能进入管理后台。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="h-10 rounded-lg border-stone-200 text-stone-700 hover:bg-stone-50">取消</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} className="h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">退出登录</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
