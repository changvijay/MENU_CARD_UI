
const Contact = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            Get in touch with us. We&apos;d love to hear from you!
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Send us a Message
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input 
                  type="text" 
                  className="glass-input"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  className="glass-input"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea 
                  rows="4" 
                  className="glass-input"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full"
              >
                Send Message
              </button>
            </form>
          </div>
          
          <div className="glass-card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Contact Information
            </h2>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-primary-600 text-sm">📧</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-500">contact@example.com</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-primary-600 text-sm">📞</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-primary-600 text-sm">📍</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-500">
                    123 Business Ave<br />
                    Suite 100<br />
                    City, State 12345
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
