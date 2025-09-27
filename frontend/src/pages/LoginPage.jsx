import { SignIn } from '@clerk/clerk-react'
import { Utensils, Sparkles, ChefHat, Star, ArrowRight } from 'lucide-react'

const LoginPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
        }}
      >
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/80 to-slate-900/90"></div>

        {/* Secondary Food Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`
          }}
        ></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/12 w-32 h-32 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-3/4 right-1/6 w-24 h-24 bg-gradient-to-r from-yellow-400/25 to-orange-400/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full blur-md animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/6 right-1/4 w-16 h-16 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>

        {/* Floating Food Icons */}
        <div className="absolute top-1/5 left-1/4 text-orange-300/40 animate-bounce" style={{animationDelay: '1s'}}>
          <ChefHat className="w-8 h-8" />
        </div>
        <div className="absolute bottom-1/4 right-1/3 text-yellow-300/40 animate-bounce" style={{animationDelay: '3s'}}>
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute top-2/3 left-1/6 text-green-300/40 animate-bounce" style={{animationDelay: '2s'}}>
          <Sparkles className="w-7 h-7" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex">
        {/* Left Side - Brand Section */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-start pl-16 pr-8">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-4xl font-bold text-white">NourishNet</h1>
                <p className="text-orange-300 font-medium">Tiffin Management</p>
              </div>
            </div>

            {/* Hero Content */}
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Manage Your
              <span className="block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Tiffin Business
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Streamline orders, manage deliveries, and grow your tiffin service with our comprehensive management platform.
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {[
                '📊 Real-time Dashboard Analytics',
                '🚚 Smart Delivery Management',
                '👥 Customer Order Tracking',
                '💰 Revenue & Growth Insights'
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-gray-300 group">
                  <ArrowRight className="w-4 h-4 text-orange-400 mr-3 group-hover:translate-x-1 transition-transform duration-200" />
                  <span className="group-hover:text-white transition-colors duration-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-3xl font-bold text-white">BitNBuild</h1>
                  <p className="text-orange-300 text-sm">Tiffin Management</p>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="relative">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"></div>

              {/* Subtle Inner Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>

              {/* Content */}
              <div className="relative p-8 lg:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                  <p className="text-gray-300">Sign in to your vendor dashboard</p>
                </div>

                {/* Clerk Sign In Component */}
                <SignIn 
                  appearance={{
                    elements: {
                      formButtonPrimary: `
                        bg-gradient-to-r from-orange-500 to-red-600 
                        hover:from-orange-600 hover:to-red-700 
                        text-white font-semibold py-4 px-8 rounded-xl 
                        shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40
                        transition-all duration-300 transform hover:-translate-y-0.5
                        text-base normal-case border-0 w-full
                      `,
                      card: 'bg-transparent shadow-none border-none p-0 w-full',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: `
                        bg-white/10 backdrop-blur-sm hover:bg-white/20 
                        border border-white/20 hover:border-white/30
                        rounded-xl shadow-lg hover:shadow-xl 
                        transition-all duration-300 text-white font-medium py-4 
                        transform hover:-translate-y-0.5
                      `,
                      formFieldInput: `
                        w-full px-5 py-4 border border-white/20 
                        rounded-xl focus:outline-none focus:ring-2 
                        focus:ring-orange-500/50 focus:border-orange-400 
                        bg-white/10 backdrop-blur-sm transition-all duration-300 
                        placeholder-gray-400 text-white
                        hover:bg-white/15 hover:border-white/30
                      `,
                      formFieldLabel: 'block text-sm font-semibold text-gray-300 mb-3',
                      dividerLine: 'bg-white/20',
                      dividerText: 'text-gray-400 font-medium bg-transparent px-4',
                      footerActionLink: 'text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-200',
                      identityPreviewText: 'text-gray-300',
                      identityPreviewEditButton: 'text-orange-400 hover:text-orange-300 transition-colors duration-200',
                      formFieldInputShowPasswordButton: 'text-gray-400 hover:text-white transition-colors duration-200',
                    },
                    layout: {
                      socialButtonsPlacement: 'top'
                    }
                  }}
                />

                {/* Additional Info */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <p className="text-sm text-gray-300">
                      New vendor? <span className="text-orange-400 font-semibold">Contact support for registration</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-400">Vendors</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-400">Orders</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">₹5L+</div>
                <div className="text-sm text-gray-400">Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage