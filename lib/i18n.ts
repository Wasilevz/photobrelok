export type Locale = "ru" | "ro";

export interface Dict {
  meta: {
    title: string;
    description: string;
  };
  home: {
    title: string;
    subtitle: string;
    priceLine: (price: number) => string;
    slotHint: string;
    helperEmpty: string;
    helperMore: (n: number) => string;
    helperReady: string;
    ctaUpload: string;
    ctaOrder: string;
    photoCount: (n: number) => string;
    replace: string;
    remove: string;
    uploadTruncated: (added: number, total: number) => string;
  };
  cropper: {
    progress: (cur: number, total: number) => string;
    zoomLow: string;
    zoomHigh: string;
    skip: string;
    cancel: string;
    crop: string;
  };
  orderModal: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneError: string;
    submitting: string;
    submit: string;
    close: string;
  };
  errors: {
    genericSubmit: string;
    unknown: string;
    uploadFailed: string;
  };
  thanks: {
    orderAccepted: string;
    accepted: string;
    orderNumber: string;
    willContact: string;
    sameOrderBadge: string;
    todayOnly: string;
    upsellTitle1: string;
    upsellDiscount: string;
    upsellDescPre: string;
    upsellDescBold: string;
    upsellDescPost: string;
    regularPrice: string;
    discountPrice: string;
    currency: string;
    youSave: string;
    saveAmount: string;
    adding: string;
    addUpsell: string;
    noThanks: string;
    upsellErrorGeneric: string;
    acceptedTitle: string;
    acceptedDescLine1: string;
    acceptedDescLine2: string;
    neutralTitle: string;
    neutralExpired: string;
    neutralDeclined: string;
    paymentTitle: string;
    paymentSub: string;
    backToSite: string;
  };
}

export const translations: Record<Locale, Dict> = {
  ru: {
    meta: {
      title: "Фото-брелок из ваших фотографий | Photobrelok",
      description:
        "Загрузите любимые фото и получите уникальный брелок с мини-фотографиями. Оплата при получении.",
    },
    home: {
      title: "Фото-брелок своими руками",
      subtitle:
        "Загрузите от 6 до 10 любимых фото — мы напечатаем их на плёнке и сделаем уникальный брелок",
      priceLine: (price: number) => `${price} лей · Оплата при получении`,
      slotHint: "нажми",
      helperEmpty: "Нажмите на кадр → можно выбрать сразу несколько фото",
      helperMore: (n: number) => `Ещё ${n} фото до оформления`,
      helperReady: "Отлично! Можно оформлять заказ",
      ctaUpload: "Загрузите от 6 фото",
      ctaOrder: "Оформить заказ",
      photoCount: (n: number) => `${n}/10 фото`,
      replace: "Заменить",
      remove: "Удалить",
      uploadTruncated: (added: number, total: number) =>
        `Добавлено ${added} из ${total} фото — все слоты заполнены (максимум 10)`,
    },
    cropper: {
      progress: (cur: number, total: number) => `Фото ${cur} из ${total}`,
      zoomLow: "Мало",
      zoomHigh: "Много",
      skip: "Пропустить",
      cancel: "Отмена",
      crop: "Ообрезать",
    },
    orderModal: {
      title: "Почти готово!",
      subtitle: "Оставьте контакт — свяжемся для подтверждения в течение 30 минут",
      nameLabel: "Как к вам обращаться?",
      namePlaceholder: "Николай Гергич",
      phoneLabel: "Номер телефона",
      phonePlaceholder: "60 123 456",
      phoneError: "Введите номер телефона без кода страны",
      submitting: "Отправка...",
      submit: "Подтвердить заказ",
      close: "Закрыть",
    },
    errors: {
      genericSubmit: "Сбой отправки заказа. Попробуйте ещё раз.",
      unknown: "Неизвестная ошибка",
      uploadFailed: "Не удалось загрузить фото. Попробуйте ещё раз.",
    },
    thanks: {
      orderAccepted: "Заказ",
      accepted: "принят!",
      orderNumber: "Номер заказа:",
      willContact: "Мы свяжемся с вами в течение 30 минут для подтверждения",
      sameOrderBadge: "В том же заказе",
      todayOnly: "Только сегодня",
      upsellTitle1: "Добавьте второй брелок",
      upsellDiscount: "-40%",
      upsellDescPre: "Второй такой же брелок",
      upsellDescBold: "в тот же заказ",
      upsellDescPost: "— идеально как подарок для близкого человека",
      regularPrice: "Обычная цена:",
      discountPrice: "Сейчас со скидкой:",
      currency: "лей",
      youSave: "Ваша экономия",
      saveAmount: "100 леев",
      adding: "Добавляем...",
      addUpsell: "Да, добавить со скидкой",
      noThanks: "Нет, спасибо",
      upsellErrorGeneric:
        "Не получилось оформить добавление. Попробуйте ещё раз — либо просто скажите об этом при звонке.",
      acceptedTitle: "Отличный выбор!",
      acceptedDescLine1: "Мы добавили второй брелок в вашу посылку.",
      acceptedDescLine2: "Сэкономили 100 леев!",
      neutralTitle: "Хорошо, увидимся!",
      neutralExpired:
        "Предложение по второму брелоку истекло, но ваш основной заказ уже у нас в работе.",
      neutralDeclined: "Ваш заказ уже у нас в работе — мы позвоним для подтверждения.",
      paymentTitle: "Оплата при получении",
      paymentSub: "Никаких предоплат",
      backToSite: "← Вернуться на сайт",
    },
  },
  ro: {
    meta: {
      title: "Breloc foto personalizat | Photobrelok",
      description:
        "Încarcă pozele preferate și primești un breloc unic cu mini-fotografii. Plată la livrare.",
    },
    home: {
      title: "Breloc foto personalizat",
      subtitle:
        "Încarcă de la 6 la 10 poze preferate — le imprimăm pe film și facem un breloc unic",
      priceLine: (price: number) => `${price} lei · Plată la livrare`,
      slotHint: "apasă",
      helperEmpty: "Apasă pe cadru → poți alege mai multe poze deodată",
      helperMore: (n: number) => `Încă ${n} poze până la comandă`,
      helperReady: "Perfect! Poți plasa comanda",
      ctaUpload: "Încarcă minim 6 poze",
      ctaOrder: "Plasează comanda",
      photoCount: (n: number) => `${n}/10 poze`,
      replace: "Înlocuiește",
      remove: "Șterge",
      uploadTruncated: (added: number, total: number) =>
        `Adăugate ${added} din ${total} poze — toate sloturile sunt ocupate (maxim 10)`,
    },
    cropper: {
      progress: (cur: number, total: number) => `Poza ${cur} din ${total}`,
      zoomLow: "Puțin",
      zoomHigh: "Mult",
      skip: "Sari peste",
      cancel: "Anulează",
      crop: "Decupează",
    },
    orderModal: {
      title: "Aproape gata!",
      subtitle: "Lasă-ne un contact — te contactăm pentru confirmare în 30 de minute",
      nameLabel: "Cum să-ți spunem?",
      namePlaceholder: "Ion Popescu",
      phoneLabel: "Număr de telefon",
      phonePlaceholder: "069 123 456",
      phoneError: "Introdu numărul de telefon fără prefixul țării",
      submitting: "Se trimite...",
      submit: "Confirmă comanda",
      close: "Închide",
    },
    errors: {
      genericSubmit: "Comanda nu a putut fi trimisă. Încearcă din nou.",
      unknown: "Eroare necunoscută",
      uploadFailed: "Nu s-a putut încărca poza. Încearcă din nou.",
    },
    thanks: {
      orderAccepted: "Comanda",
      accepted: "a fost preluată!",
      orderNumber: "Numărul comenzii:",
      willContact: "Te contactăm în 30 de minute pentru confirmare",
      sameOrderBadge: "În aceeași comandă",
      todayOnly: "Doar azi",
      upsellTitle1: "Adaugă un al doilea breloc",
      upsellDiscount: "-40%",
      upsellDescPre: "Un breloc identic",
      upsellDescBold: "în aceeași comandă",
      upsellDescPost: "— perfect ca cadou pentru cineva drag",
      regularPrice: "Preț obișnuit:",
      discountPrice: "Acum cu reducere:",
      currency: "lei",
      youSave: "Economisești",
      saveAmount: "100 lei",
      adding: "Se adaugă...",
      addUpsell: "Da, adaugă cu reducere",
      noThanks: "Nu, mulțumesc",
      upsellErrorGeneric:
        "Adăugarea nu a reușit. Încearcă din nou — sau spune-ne la telefon.",
      acceptedTitle: "Alegere excelentă!",
      acceptedDescLine1: "Am adăugat al doilea breloc în comanda ta.",
      acceptedDescLine2: "Ai economisit 100 lei!",
      neutralTitle: "Bine, pe curând!",
      neutralExpired:
        "Oferta pentru al doilea breloc a expirat, dar comanda ta principală este deja în lucru.",
      neutralDeclined: "Comanda ta este deja în lucru — te contactăm pentru confirmare.",
      paymentTitle: "Plată la livrare",
      paymentSub: "Fără avans",
      backToSite: "← Înapoi la site",
    },
  },
};
