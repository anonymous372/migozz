const Register = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700"
          />
          <input
            type="email"
            placeholder="Email"
            className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700"
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 rounded-md border dark:border-gray-600 dark:bg-gray-700"
          />
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md">
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
