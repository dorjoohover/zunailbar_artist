import Image from "next/image";
import { LoginForm } from "./components";

const Page = async () => {
  return (
    <section className="fixed top-0 left-0 h-screen w-screen flex-center bg-cover bg-no-repeat p-4 bg-white ">
      {/* <div className="custom-bg absolute top-0 left-0 size-full object-cover"></div> */}
      <div className="max-w-5xl bg-white border backdrop-blur-md p-4 rounded-3xl space-y-10 w-full shadow-light">
        <div className="grid md:grid-cols-2 w-full h-[80vh]">
          <div className="bg-[#1b1328] rounded-2xl hidden md:block">
            <Image src={"/logo/zu-white.png"} width={300} height={300} alt="logo" />
          </div>
          <div className="md:p-10 space-y-10 flex-col flex justify-center">
            <h1 className="text-2xl font-bold text-center">Zu Nailbar Admin</h1>
            <LoginForm
            // save={(token, branch, merchant) => handleLogin(token, branch, merchant)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page;
