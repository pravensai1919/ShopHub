import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Alert, AlertDescription } from './components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { useToast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, Users, ShoppingBag, Star, Filter, User, LogOut, Settings } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.access_token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return { user: action.payload.user, token: action.payload.access_token, isAuthenticated: true };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { user: null, token: null, isAuthenticated: false };
    case 'LOAD_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true };
    default:
      return state;
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      dispatch({ type: 'LOAD_USER', payload: { token, user: JSON.parse(user) } });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Cart Context
const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.find(item => item.product_id === action.payload.product_id);
      if (existingItem) {
        return state.map(item => 
          item.product_id === action.payload.product_id 
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      }
      return [...state, action.payload];
    case 'UPDATE_QUANTITY':
      return state.map(item => 
        item.product_id === action.payload.product_id 
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    case 'REMOVE_FROM_CART':
      return state.filter(item => item.product_id !== action.payload.product_id);
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

const CartProvider = ({ children }) => {
  const [cartItems, dispatch] = useReducer(cartReducer, []);

  return (
    <CartContext.Provider value={{ cartItems, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// API Setup
const setupAxios = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Components
const Header = () => {
  const { state, dispatch } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setupAxios(null);
    navigate('/');
  };

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors">
            ShopHub
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-gray-700 hover:text-orange-600 transition-colors">Products</Link>
            {state.isAuthenticated && (
              <>
                <Link to="/orders" className="text-gray-700 hover:text-orange-600 transition-colors">My Orders</Link>
                {state.user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-orange-600 transition-colors">Admin</Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {state.isAuthenticated ? (
              <>
                <Link to="/cart" className="relative">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <ShoppingCart size={18} />
                    {cartItemCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Hi, {state.user?.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut size={16} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-orange-400">ShopHub</h3>
            <p className="text-gray-400">Your one-stop destination for quality products at great prices.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">Email: support@shophub.com</p>
            <p className="text-gray-400">Phone: (555) 123-4567</p>
          </div>
        </div>
        <Separator className="my-8 bg-gray-700" />
        <div className="text-center text-gray-400">
          <p>&copy; 2024 ShopHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  const { state } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to ShopHub</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Discover amazing products at unbeatable prices. Your perfect shopping experience starts here.</p>
          <Button 
            size="lg" 
            className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-4"
            onClick={() => navigate('/products')}
          >
            Shop Now
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShopHub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality Products</h3>
              <p className="text-gray-600">Carefully curated selection of high-quality products from trusted brands.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Easy Shopping</h3>
              <p className="text-gray-600">Simple and intuitive shopping experience with secure checkout process.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Great Support</h3>
              <p className="text-gray-600">Dedicated customer support team ready to help with any questions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const Login = () => {
  const { dispatch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      dispatch({ type: 'LOGIN', payload: response.data });
      setupAxios(response.data.access_token);
      toast({ title: "Login successful!" });
      navigate('/');
    } catch (error) {
      toast({ 
        title: "Login failed", 
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? <Link to="/register" className="text-orange-600 hover:underline">Sign up</Link>
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Demo Accounts:</strong><br />
              Admin: admin@shop.com / admin123<br />
              User: Register a new account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Register = () => {
  const { dispatch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'user' 
  });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      dispatch({ type: 'LOGIN', payload: response.data });
      setupAxios(response.data.access_token);
      toast({ title: "Account created successfully!" });
      navigate('/');
    } catch (error) {
      toast({ 
        title: "Registration failed", 
        description: error.response?.data?.detail || "Failed to create account",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join ShopHub today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Account Type</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account? <Link to="/login" className="text-orange-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const { cartItems } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);

  const cartItem = cartItems.find(item => item.product_id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    if (quantity > product.stock_quantity - cartQuantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.stock_quantity - cartQuantity} items available`,
        variant: "destructive"
      });
      return;
    }
    onAddToCart({ product_id: product.id, quantity });
    toast({ title: `Added ${quantity} ${product.name}(s) to cart` });
    setQuantity(1);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-orange-600">${product.price}</span>
          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
          </Badge>
        </div>
        {cartQuantity > 0 && (
          <p className="text-sm text-blue-600 mb-2">{cartQuantity} in cart</p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-8 w-8 p-0"
            >
              <Minus size={14} />
            </Button>
            <span className="px-3 py-1 text-sm">{quantity}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuantity(quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus size={14} />
            </Button>
          </div>
          <Button 
            onClick={handleAddToCart} 
            disabled={product.stock_quantity === 0 || quantity > product.stock_quantity - cartQuantity}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            size="sm"
          >
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Products = () => {
  const { state } = useAuth();
  const { dispatch } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      
      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to load products",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, [search, minPrice, maxPrice]);

  React.useEffect(() => {
    if (state.token) {
      setupAxios(state.token);
    }
  }, [state.token]);

  const handleAddToCart = (item) => {
    if (!state.isAuthenticated) {
      toast({ 
        title: "Please login", 
        description: "You need to login to add items to cart",
        variant: "destructive" 
      });
      return;
    }
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Our Products</h1>
        
        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="$0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="$999"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Cart = () => {
  const { state } = useAuth();
  const { cartItems, dispatch } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: { product_id: productId } });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity: newQuantity } });
    }
  };

  const removeItem = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { product_id: productId } });
    toast({ title: "Item removed from cart" });
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      toast({ 
        title: "Address required", 
        description: "Please enter your delivery address",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        delivery_address: deliveryAddress
      };
      
      await axios.post(`${API}/orders`, orderData);
      dispatch({ type: 'CLEAR_CART' });
      toast({ title: "Order placed successfully!" });
      navigate('/orders');
    } catch (error) {
      toast({ 
        title: "Checkout failed", 
        description: error.response?.data?.detail || "Failed to place order",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!state.isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Login</h1>
        <p className="mb-4">You need to login to view your cart</p>
        <Link to="/login">
          <Button className="bg-orange-600 hover:bg-orange-700">Login</Button>
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="mb-4">Add some products to get started</p>
        <Link to="/products">
          <Button className="bg-orange-600 hover:bg-orange-700">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.product_id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image_url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop"} 
                      alt={item.name || "Product"}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name || "Product"}</h3>
                      <p className="text-gray-600">${item.price || 0}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="px-3 py-1 text-sm border rounded">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus size={14} />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeItem(item.product_id)}
                        className="h-8 w-8 p-0 ml-4"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total: ${total.toFixed(2)}</span>
              </div>
              
              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your delivery address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={handleCheckout} 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const { state } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/orders`);
        setOrders(response.data);
      } catch (error) {
        toast({ 
          title: "Error", 
          description: "Failed to load orders",
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    if (state.token) {
      setupAxios(state.token);
      fetchOrders();
    }
  }, [state.token]);

  if (!state.isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Login</h1>
        <Link to="/login">
          <Button className="bg-orange-600 hover:bg-orange-700">Login</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {state.user?.role === 'admin' ? 'All Orders' : 'My Orders'}
      </h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
          <p className="text-gray-500">Start shopping to see your orders here</p>
          <Link to="/products" className="inline-block mt-4">
            <Button className="bg-orange-600 hover:bg-orange-700">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                    <CardDescription>
                      {state.user?.role === 'admin' && (
                        <span>Customer: {order.user_name} ({order.user_email})<br /></span>
                      )}
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    order.status === 'delivered' ? 'default' : 
                    order.status === 'shipped' ? 'secondary' : 'outline'
                  }>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address:</p>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">Total: ${order.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const Admin = () => {
  const { state } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const [newProduct, setNewProduct] = React.useState({
    name: '', description: '', price: '', stock_quantity: '', image_url: ''
  });

  React.useEffect(() => {
    if (state.token) {
      setupAxios(state.token);
      fetchData();
    }
  }, [state.token]);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`)
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to load data",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/products`, {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock_quantity: parseInt(newProduct.stock_quantity)
      });
      toast({ title: "Product created successfully!" });
      setNewProduct({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
      fetchData();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to create product",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      toast({ title: "Order status updated!" });
      fetchData();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update order status",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast({ title: "Product deleted successfully!" });
      fetchData();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete product",
        variant: "destructive" 
      });
    }
  };

  if (state.user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    Add Product
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">${product.price} • Stock: {product.stock_quantity}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 border rounded">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          {order.user_name} ({order.user_email})
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p><strong>Items:</strong></p>
                      {order.items.map((item, index) => (
                        <p key={index} className="ml-4">• {item.product_name} × {item.quantity}</p>
                      ))}
                      <p className="mt-2"><strong>Address:</strong> {order.delivery_address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{products.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{orders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  ${orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { state } = useAuth();
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && state.user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="App min-h-screen bg-gray-50">
          <BrowserRouter>
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </BrowserRouter>
          <Toaster />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;