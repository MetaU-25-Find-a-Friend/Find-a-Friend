/**
 * 
 * @param accountData email and password for new account
 * @returns true and success message if account was created; false and reason for error if validation failed
 */
export const createAccount = async (accountData: {
    email: String;
    password: String;
}) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/signup`, {
        method: "post",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
    });

    const message = await response.text();

    return [response.ok, message];
};
