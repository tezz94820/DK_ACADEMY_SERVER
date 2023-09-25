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
export { checkStudentAlreadyPresent, checkStudentIsVerified, deleteStudent, createStudent }