import requests
import sys
import json
from datetime import datetime
import time

class ShopHubAPITester:
    def __init__(self, base_url="https://shopmanager-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_email = f"testuser_{int(time.time())}@test.com"
        self.test_product_id = None
        self.test_order_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            result_data = {}
            
            try:
                result_data = response.json()
            except:
                result_data = {"text": response.text}
            
            return success, response.status_code, result_data
            
        except requests.exceptions.RequestException as e:
            return False, 0, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login with default credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, status, data = self.make_request(
            'POST', 'auth/login',
            {"email": "admin@shop.com", "password": "admin123"}
        )
        
        if success and 'access_token' in data:
            self.admin_token = data['access_token']
            user_info = data.get('user', {})
            details = f"- Role: {user_info.get('role')}, Name: {user_info.get('name')}"
            return self.log_test("Admin Login", True, details)
        else:
            return self.log_test("Admin Login", False, f"Status: {status}, Data: {data}")

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        user_data = {
            "name": "Test User",
            "email": self.test_user_email,
            "password": "testpass123",
            "role": "user"
        }
        
        success, status, data = self.make_request(
            'POST', 'auth/register', user_data, expected_status=200
        )
        
        if success and 'access_token' in data:
            self.user_token = data['access_token']
            user_info = data.get('user', {})
            details = f"- Email: {user_info.get('email')}, Role: {user_info.get('role')}"
            return self.log_test("User Registration", True, details)
        else:
            return self.log_test("User Registration", False, f"Status: {status}, Data: {data}")

    def test_user_login(self):
        """Test user login"""
        print("\n🔑 Testing User Login...")
        
        success, status, data = self.make_request(
            'POST', 'auth/login',
            {"email": self.test_user_email, "password": "testpass123"}
        )
        
        if success and 'access_token' in data:
            self.user_token = data['access_token']
            return self.log_test("User Login", True, f"- Token received")
        else:
            return self.log_test("User Login", False, f"Status: {status}")

    def test_get_current_user(self):
        """Test getting current user info"""
        print("\n👥 Testing Get Current User...")
        
        # Test with user token
        success, status, data = self.make_request(
            'GET', 'auth/me', token=self.user_token
        )
        
        if success and 'email' in data:
            details = f"- Email: {data.get('email')}, Role: {data.get('role')}"
            return self.log_test("Get Current User", True, details)
        else:
            return self.log_test("Get Current User", False, f"Status: {status}")

    def test_get_products(self):
        """Test getting products list"""
        print("\n📦 Testing Get Products...")
        
        success, status, data = self.make_request('GET', 'products')
        
        if success and isinstance(data, list):
            product_count = len(data)
            if product_count > 0:
                sample_product = data[0]
                self.test_product_id = sample_product.get('id')
                details = f"- Found {product_count} products, Sample: {sample_product.get('name')}"
                return self.log_test("Get Products", True, details)
            else:
                return self.log_test("Get Products", False, "No products found")
        else:
            return self.log_test("Get Products", False, f"Status: {status}")

    def test_search_products(self):
        """Test product search functionality"""
        print("\n🔍 Testing Product Search...")
        
        # Test search by name
        success, status, data = self.make_request('GET', 'products?search=headphones')
        
        if success and isinstance(data, list):
            details = f"- Search 'headphones' returned {len(data)} results"
            return self.log_test("Product Search", True, details)
        else:
            return self.log_test("Product Search", False, f"Status: {status}")

    def test_filter_products_by_price(self):
        """Test product price filtering"""
        print("\n💰 Testing Product Price Filter...")
        
        # Test price range filter
        success, status, data = self.make_request('GET', 'products?min_price=50&max_price=150')
        
        if success and isinstance(data, list):
            details = f"- Price filter (50-150) returned {len(data)} results"
            return self.log_test("Product Price Filter", True, details)
        else:
            return self.log_test("Product Price Filter", False, f"Status: {status}")

    def test_create_product_admin(self):
        """Test creating a new product (admin only)"""
        print("\n➕ Testing Create Product (Admin)...")
        
        new_product = {
            "name": "Test Product",
            "description": "A test product created by automated testing",
            "price": 49.99,
            "stock_quantity": 10,
            "image_url": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop"
        }
        
        success, status, data = self.make_request(
            'POST', 'products', new_product, token=self.admin_token, expected_status=200
        )
        
        if success and 'id' in data:
            self.test_product_id = data['id']
            details = f"- Created product: {data.get('name')} (ID: {data.get('id')[:8]}...)"
            return self.log_test("Create Product (Admin)", True, details)
        else:
            return self.log_test("Create Product (Admin)", False, f"Status: {status}, Data: {data}")

    def test_create_product_user_forbidden(self):
        """Test that regular users cannot create products"""
        print("\n🚫 Testing Create Product (User - Should Fail)...")
        
        new_product = {
            "name": "Unauthorized Product",
            "description": "This should fail",
            "price": 99.99,
            "stock_quantity": 5
        }
        
        success, status, data = self.make_request(
            'POST', 'products', new_product, token=self.user_token, expected_status=403
        )
        
        if success:  # Success means we got the expected 403 status
            return self.log_test("Create Product (User Forbidden)", True, "- Correctly denied access")
        else:
            return self.log_test("Create Product (User Forbidden)", False, f"Expected 403, got {status}")

    def test_update_product_admin(self):
        """Test updating a product (admin only)"""
        print("\n✏️ Testing Update Product (Admin)...")
        
        if not self.test_product_id:
            return self.log_test("Update Product (Admin)", False, "No test product ID available")
        
        update_data = {
            "price": 59.99,
            "stock_quantity": 15
        }
        
        success, status, data = self.make_request(
            'PUT', f'products/{self.test_product_id}', update_data, 
            token=self.admin_token, expected_status=200
        )
        
        if success and data.get('price') == 59.99:
            details = f"- Updated price to ${data.get('price')}, stock to {data.get('stock_quantity')}"
            return self.log_test("Update Product (Admin)", True, details)
        else:
            return self.log_test("Update Product (Admin)", False, f"Status: {status}")

    def test_create_order(self):
        """Test creating an order"""
        print("\n🛒 Testing Create Order...")
        
        if not self.test_product_id:
            return self.log_test("Create Order", False, "No test product ID available")
        
        order_data = {
            "items": [
                {
                    "product_id": self.test_product_id,
                    "quantity": 2
                }
            ],
            "delivery_address": "123 Test Street, Test City, TC 12345"
        }
        
        success, status, data = self.make_request(
            'POST', 'orders', order_data, token=self.user_token, expected_status=200
        )
        
        if success and 'id' in data:
            self.test_order_id = data['id']
            details = f"- Order created: {data.get('id')[:8]}..., Total: ${data.get('total_amount')}"
            return self.log_test("Create Order", True, details)
        else:
            return self.log_test("Create Order", False, f"Status: {status}, Data: {data}")

    def test_get_orders_user(self):
        """Test getting user's orders"""
        print("\n📋 Testing Get Orders (User)...")
        
        success, status, data = self.make_request(
            'GET', 'orders', token=self.user_token
        )
        
        if success and isinstance(data, list):
            order_count = len(data)
            details = f"- User has {order_count} orders"
            return self.log_test("Get Orders (User)", True, details)
        else:
            return self.log_test("Get Orders (User)", False, f"Status: {status}")

    def test_get_orders_admin(self):
        """Test getting all orders (admin)"""
        print("\n📊 Testing Get Orders (Admin)...")
        
        success, status, data = self.make_request(
            'GET', 'orders', token=self.admin_token
        )
        
        if success and isinstance(data, list):
            order_count = len(data)
            details = f"- Admin sees {order_count} total orders"
            return self.log_test("Get Orders (Admin)", True, details)
        else:
            return self.log_test("Get Orders (Admin)", False, f"Status: {status}")

    def test_update_order_status(self):
        """Test updating order status (admin only)"""
        print("\n📦 Testing Update Order Status (Admin)...")
        
        if not self.test_order_id:
            return self.log_test("Update Order Status", False, "No test order ID available")
        
        status_update = {"status": "shipped"}
        
        success, status, data = self.make_request(
            'PUT', f'orders/{self.test_order_id}/status', status_update,
            token=self.admin_token, expected_status=200
        )
        
        if success and data.get('status') == 'shipped':
            details = f"- Order status updated to: {data.get('status')}"
            return self.log_test("Update Order Status (Admin)", True, details)
        else:
            return self.log_test("Update Order Status (Admin)", False, f"Status: {status}")

    def test_delete_product_admin(self):
        """Test deleting a product (admin only)"""
        print("\n🗑️ Testing Delete Product (Admin)...")
        
        if not self.test_product_id:
            return self.log_test("Delete Product (Admin)", False, "No test product ID available")
        
        success, status, data = self.make_request(
            'DELETE', f'products/{self.test_product_id}', token=self.admin_token, expected_status=200
        )
        
        if success:
            details = f"- Product deleted successfully"
            return self.log_test("Delete Product (Admin)", True, details)
        else:
            return self.log_test("Delete Product (Admin)", False, f"Status: {status}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ShopHub API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
            
        if not self.test_user_registration():
            print("❌ User registration failed - stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ User login failed - stopping tests")
            return False
            
        self.test_get_current_user()
        
        # Product Tests
        self.test_get_products()
        self.test_search_products()
        self.test_filter_products_by_price()
        self.test_create_product_admin()
        self.test_create_product_user_forbidden()
        self.test_update_product_admin()
        
        # Order Tests
        self.test_create_order()
        self.test_get_orders_user()
        self.test_get_orders_admin()
        self.test_update_order_status()
        
        # Cleanup
        self.test_delete_product_admin()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Backend is working correctly.")
            return True
        else:
            failed_tests = self.tests_run - self.tests_passed
            print(f"⚠️  {failed_tests} tests failed. Check the issues above.")
            return False

def main():
    tester = ShopHubAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())