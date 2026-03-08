export const parseBooleanEnvFlag = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return false;

    switch (value.trim().toLowerCase()) {
        case '1':
        case 'true':
        case 'yes':
        case 'on':
            return true;
        default:
            return false;
    }
};
