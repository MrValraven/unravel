import { defineCopy } from "../i18n/useCopy";

const en = {
  dialog: {
    close: "Close dialog",
  },
  pageHeader: {
    back: "Back",
  },
  ageGate: {
    title: "Adult content ahead",
    description:
      "{deck} has explicit questions for adults. Confirm you are 18 or older to play it.",
    confirm: "Confirm I'm 18 or older",
    cancel: "Go back",
  },
  updateBanner: {
    message: "A new version of Unravel is ready",
    update: "Update now",
    updating: "Updating",
    dismiss: "Hide update notice",
    failed:
      "The new version could not install in this tab. Close Unravel and open it again to finish the update.",
  },
  offline: {
    ready: "Ready to play offline",
    readyDetail:
      "Unravel is saved on this device, so the decks work without a connection.",
    dismissReady: "Hide offline notice",
    offline: "Offline. Your decks still work.",
  },
  dailyReminder: {
    label: "Daily card reminder",
    description:
      "A notification with the card of the day, about once a day. Your phone picks the time.",
    installFirst:
      "Works in the installed app. Add Unravel to your home screen and turn this on from there.",
    turningOn: "Turning on the daily card reminder",
    turnedOn: "Daily card reminder is on",
    turnedOff: "Daily card reminder is off",
    notificationTitle: "Card of the day",
    notificationFallback:
      "A new card of the day is waiting. Open Unravel to read it.",
    errors: {
      unsupported:
        "This browser cannot wake Unravel in the background, so daily reminders are not available here.",
      notificationsDenied:
        "Notifications are blocked for Unravel, so the reminder has nowhere to appear. Allow notifications for this site in your browser settings, then try again.",
      notificationsDismissed:
        "The notification request closed without an answer. Turn the reminder on again and choose Allow.",
      notInstalled:
        "Daily reminders only work in the installed app. Add Unravel to your home screen, open it from there and turn this on again.",
      backgroundSyncBlocked:
        "Background sync is blocked for Unravel, so it cannot wake up once a day. Allow background sync in this site's settings, then try again.",
      noServiceWorker:
        "Unravel has not finished saving itself for offline use, so the reminder cannot be scheduled yet. Reload Unravel and try again.",
      syncRefused:
        "The browser refused to schedule the reminder ({reason}). Try again later.",
      scheduleNotSaved:
        "Site storage is blocked for Unravel, so the coming days' cards could not be saved for the reminder. Allow site data for this site, then try again.",
      turnOffFailed:
        "The browser refused to cancel the reminder ({reason}). Reload Unravel and try again.",
    },
  },
  notFound: {
    documentTitle: "Page not found",
    title: "This page wandered off",
    body: "The link may be old or mistyped. All the decks are right where you left them.",
    backToDecks: "Back to decks",
  },
  loading: {
    label: "Loading page",
  },
  routeError: {
    updateTitle: "A newer version of Unravel is available",
    updateBody:
      "Unravel was updated after this tab opened, so this screen needs a reload to fetch its new files. Your decks and saved games stay on this device.",
    unexpectedTitle: "This screen hit an unexpected problem",
    unexpectedBody:
      "Reload Unravel to try again, or go back to the home screen. Your decks and saved games stay on this device.",
    reload: "Reload Unravel",
    backToHome: "Back to home",
  },
};

export const sharedCopy = defineCopy<typeof en>({
  en,
  pt: {
    dialog: {
      close: "Fechar janela",
    },
    pageHeader: {
      back: "Voltar",
    },
    ageGate: {
      title: "Conteúdo para adultos",
      description:
        "{deck} tem perguntas explícitas para adultos. Confirma que tens 18 anos ou mais para jogar.",
      confirm: "Confirmo que tenho 18 anos ou mais",
      cancel: "Voltar",
    },
    updateBanner: {
      message: "Há uma nova versão do Unravel pronta",
      update: "Atualizar agora",
      updating: "A atualizar",
      dismiss: "Esconder aviso de atualização",
      failed:
        "Não foi possível instalar a nova versão neste separador. Fecha o Unravel e abre-o de novo para concluir a atualização.",
    },
    offline: {
      ready: "Pronto para jogar sem internet",
      readyDetail:
        "O Unravel ficou guardado neste dispositivo, por isso os baralhos funcionam sem ligação.",
      dismissReady: "Esconder aviso de modo sem internet",
      offline: "Sem ligação. Os teus baralhos continuam a funcionar.",
    },
    dailyReminder: {
      label: "Lembrete da carta do dia",
      description:
        "Uma notificação com a carta do dia, mais ou menos uma vez por dia. O telemóvel escolhe a hora.",
      installFirst:
        "Funciona na app instalada. Adiciona o Unravel ao ecrã principal e ativa isto a partir de lá.",
      turningOn: "A ativar o lembrete da carta do dia",
      turnedOn: "O lembrete da carta do dia está ativo",
      turnedOff: "O lembrete da carta do dia está desativado",
      notificationTitle: "Carta do dia",
      notificationFallback:
        "Há uma nova carta do dia à tua espera. Abre o Unravel para a leres.",
      errors: {
        unsupported:
          "Este navegador não consegue acordar o Unravel em segundo plano, por isso os lembretes diários não estão disponíveis aqui.",
        notificationsDenied:
          "As notificações estão bloqueadas para o Unravel, por isso o lembrete não tem onde aparecer. Permite notificações para este site nas definições do navegador e tenta outra vez.",
        notificationsDismissed:
          "O pedido de notificações fechou sem resposta. Ativa o lembrete outra vez e escolhe Permitir.",
        notInstalled:
          "Os lembretes diários só funcionam na app instalada. Adiciona o Unravel ao ecrã principal, abre-o a partir de lá e ativa isto outra vez.",
        backgroundSyncBlocked:
          "A sincronização em segundo plano está bloqueada para o Unravel, por isso não consegue acordar uma vez por dia. Permite a sincronização em segundo plano nas definições deste site e tenta outra vez.",
        noServiceWorker:
          "O Unravel ainda não acabou de se guardar para uso sem internet, por isso o lembrete ainda não pode ser agendado. Recarrega o Unravel e tenta outra vez.",
        syncRefused:
          "O navegador recusou agendar o lembrete ({reason}). Tenta mais tarde.",
        scheduleNotSaved:
          "O armazenamento do site está bloqueado para o Unravel, por isso as cartas dos próximos dias não ficaram guardadas para o lembrete. Permite dados do site para este site e tenta outra vez.",
        turnOffFailed:
          "O navegador recusou cancelar o lembrete ({reason}). Recarrega o Unravel e tenta outra vez.",
      },
    },
    notFound: {
      documentTitle: "Página não encontrada",
      title: "Esta página perdeu-se pelo caminho",
      body: "O link pode estar desatualizado ou mal escrito. Os baralhos continuam todos no sítio do costume.",
      backToDecks: "Voltar aos baralhos",
    },
    loading: {
      label: "A carregar a página",
    },
    routeError: {
      updateTitle: "Há uma versão mais recente do Unravel",
      updateBody:
        "O Unravel foi atualizado depois de abrires este separador, por isso este ecrã precisa de recarregar para obter os ficheiros novos. Os teus baralhos e jogos guardados continuam neste dispositivo.",
      unexpectedTitle: "Este ecrã teve um problema inesperado",
      unexpectedBody:
        "Recarrega o Unravel para tentar outra vez, ou volta ao ecrã inicial. Os teus baralhos e jogos guardados continuam neste dispositivo.",
      reload: "Recarregar o Unravel",
      backToHome: "Voltar ao início",
    },
  },
});
