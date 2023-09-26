import Student, { IStudent, StudentModel } from "../models/Student"

const checkStudentAlreadyPresent = async (phone:string):Promise<boolean> => {
    const student = await Student.findOne({phone:phone})
    if(student)
        return true;
    return false;
}

const checkStudentIsVerified = async (phone:string):Promise<boolean> => {
    const student = await Student.findOne({phone:phone})
    if(student.phone_verified)
        return true;
    return false;   
}

const deleteStudent = async (phone:number):Promise<void> => {
    await Student.findOneAndDelete({phone:phone});
}

const createStudent = async (first_name:string, last_name:string, email:string, phone:string, password:string) => {
    const newStudent = new Student({
        first_name,
        last_name,
        email,
        phone,
        password,
        phone_verified: false,
        email_verified: false
    });

    await newStudent.save();
    return newStudent;
}


const emailOrPhoneNumber = (userContact:string):Promise<string> => {
    return new Promise((resolve, reject) => {
        const phoneRegex = /^\d{10}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if(phoneRegex.test(userContact))
            return resolve('phone');
        else if(emailRegex.test(userContact))
            return resolve('email');
        else
            return resolve('invalid');
    });
}
export { checkStudentAlreadyPresent, checkStudentIsVerified, deleteStudent, createStudent, emailOrPhoneNumber }