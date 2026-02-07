export const getNotificationStatus = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Ce navigateur ne supporte pas les notifications bureau");
    return "unsupported";
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

// Cache simple pour éviter de notifier plusieurs fois la même tâche pour le même événement
const notifiedTasks = new Set<string>();

export const sendNotification = (id: string, title: string, body: string) => {
  if (Notification.permission === "granted") {
    // On crée une clé unique par tâche et type d'alerte (début/fin)
    if (notifiedTasks.has(id)) return;
    
    new Notification(title, { 
      body, 
      icon: 'https://cdn-icons-png.flaticon.com/512/311/311081.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/311/311081.png'
    });
    
    notifiedTasks.add(id);
    
    // On nettoie le cache après 2 minutes pour permettre de futures alertes si besoin
    setTimeout(() => notifiedTasks.delete(id), 120000);
  }
};

export const checkTasksForAlerts = (tasks: any[]) => {
  const now = new Date();
  const nowTime = now.getTime();

  tasks.forEach(task => {
    const start = new Date(task.startTime);
    const startTime = start.getTime();
    const cookEnd = new Date(startTime + task.cookTime * 60000);
    const cookEndTime = cookEnd.getTime();
    
    // Alerte au début de la cuisson (fenêtre de 60s)
    const diffStart = nowTime - startTime;
    if (diffStart >= 0 && diffStart < 60000) {
      sendNotification(`${task.id}-start`, "🔥 Début de production", `C'est l'heure de lancer : ${task.name}`);
    }

    // Alerte à la fin de la cuisson (fenêtre de 60s)
    const diffEnd = nowTime - cookEndTime;
    if (diffEnd >= 0 && diffEnd < 60000) {
      sendNotification(`${task.id}-end`, "✅ Production terminée", `La préparation "${task.name}" est prête pour le refroidissement/conditionnement.`);
    }
  });
};