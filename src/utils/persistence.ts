/**
 * Utility for managing data persistence and backup tracking
 */

const LAST_BACKUP_KEY = 'rayburger_last_backup_timestamp';

export const persistence = {
    /**
     * Updates the timestamp of the last successful backup
     */
    recordBackup: () => {
        localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
    },

    /**
     * Gets the timestamp of the last backup
     */
    getLastBackupTime: (): number | null => {
        const saved = localStorage.getItem(LAST_BACKUP_KEY);
        return saved ? parseInt(saved) : null;
    },

    /**
     * Checks if a backup is needed (older than 24 hours)
     */
    isBackupUrgent: (): boolean => {
        const lastBackup = persistence.getLastBackupTime();
        if (!lastBackup) return true; // Never backed up

        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        return (Date.now() - lastBackup) > twentyFourHoursInMs;
    },

    /**
     * Formats the last backup date for display
     */
    formatLastBackup: (): string => {
        const lastBackup = persistence.getLastBackupTime();
        if (!lastBackup) return 'Nunca';
        return new Date(lastBackup).toLocaleString();
    }
};
