export type UserData = {
    role: string;
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    verificationCode: string;
}

export type loginUserParams = {
    role: string;
    email: string;
    password: string;
}