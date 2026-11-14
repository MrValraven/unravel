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
