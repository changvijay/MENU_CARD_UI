
const About = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            About Us
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            Learn more about our company and mission.
          </p>
        </div>
        
        <div className="glass-card mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Story
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We are a dedicated team committed to delivering exceptional experiences and 
            innovative solutions. Our journey began with a simple idea: to make technology 
            more accessible and user-friendly for everyone.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Today, we continue to push boundaries and create products that make a real 
            difference in people&apos;s lives. We believe in the power of collaboration, 
            creativity, and continuous learning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Our Mission
            </h3>
            <p className="text-gray-600">
              To empower individuals and businesses through innovative technology 
              solutions that are both powerful and easy to use.
            </p>
          </div>
          
          <div className="glass-card">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Our Vision
            </h3>
            <p className="text-gray-600">
              A world where technology seamlessly enhances human potential and 
              creates opportunities for everyone to succeed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
