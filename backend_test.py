import requests
import sys
import uuid
from datetime import datetime, timedelta
import json

class TutorAppTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tutor_email = f"test_tutor_{uuid.uuid4().hex[:8]}@example.com"
        self.tutor_password = "Test123!"
        self.tutor_name = "Test Tutor"
        self.student_id = None
        self.lesson_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except json.JSONDecodeError:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        success, response = self.run_test(
            "Register new tutor",
            "POST",
            "tutors",
            200,
            data={
                "name": self.tutor_name,
                "email": self.tutor_email,
                "password": self.tutor_password
            }
        )
        return success

    def test_login(self):
        """Test login and get token"""
        # For FastAPI OAuth2 password flow, we need to use form data
        url = f"{self.base_url}/api/token"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            "username": self.tutor_email,
            "password": self.tutor_password
        }
        
        self.tests_run += 1
        print(f"\n🔍 Testing Login...")
        
        try:
            response = requests.post(url, data=data, headers=headers)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                if 'access_token' in response_data:
                    self.token = response_data['access_token']
                    return True
                else:
                    print("❌ No token in response")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_get_tutor_profile(self):
        """Test getting tutor profile"""
        success, response = self.run_test(
            "Get tutor profile",
            "GET",
            "tutors/me",
            200
        )
        return success

    def test_create_student(self):
        """Test creating a new student"""
        success, response = self.run_test(
            "Create student",
            "POST",
            "students",
            200,
            data={
                "name": "Test Student",
                "notes": "Test notes",
                "lesson_link": "https://meet.google.com/test-link"
            }
        )
        if success and 'id' in response:
            self.student_id = response['id']
        return success

    def test_get_students(self):
        """Test getting all students"""
        success, response = self.run_test(
            "Get all students",
            "GET",
            "students",
            200
        )
        return success

    def test_get_student(self):
        """Test getting a specific student"""
        if not self.student_id:
            print("❌ Cannot test get_student: No student ID available")
            return False
            
        success, response = self.run_test(
            "Get student by ID",
            "GET",
            f"students/{self.student_id}",
            200
        )
        return success

    def test_update_student(self):
        """Test updating a student"""
        if not self.student_id:
            print("❌ Cannot test update_student: No student ID available")
            return False
            
        success, response = self.run_test(
            "Update student",
            "PUT",
            f"students/{self.student_id}",
            200,
            data={
                "name": "Updated Test Student",
                "notes": "Updated test notes",
                "lesson_link": "https://meet.google.com/updated-test-link"
            }
        )
        return success

    def test_update_payment_status(self):
        """Test updating payment status"""
        if not self.student_id:
            print("❌ Cannot test update_payment_status: No student ID available")
            return False
            
        success, response = self.run_test(
            "Update payment status",
            "PUT",
            f"students/{self.student_id}/payment",
            200,
            params={"status": "true"}
        )
        return success

    def test_update_homework_status(self):
        """Test updating homework status"""
        if not self.student_id:
            print("❌ Cannot test update_homework_status: No student ID available")
            return False
            
        success, response = self.run_test(
            "Update homework status",
            "PUT",
            f"students/{self.student_id}/homework",
            200,
            params={"status": "true"}
        )
        return success

    def test_create_lesson(self):
        """Test creating a new lesson"""
        if not self.student_id:
            print("❌ Cannot test create_lesson: No student ID available")
            return False
            
        # Create a lesson for tomorrow
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        end_time = tomorrow.replace(hour=11, minute=0, second=0, microsecond=0)
        
        success, response = self.run_test(
            "Create lesson",
            "POST",
            "lessons",
            200,
            data={
                "title": "Test Lesson",
                "student_id": self.student_id,
                "subject": "Test Subject",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "notes": "Test lesson notes"
            }
        )
        if success and 'id' in response:
            self.lesson_id = response['id']
        return success

    def test_get_lessons(self):
        """Test getting all lessons"""
        success, response = self.run_test(
            "Get all lessons",
            "GET",
            "lessons",
            200
        )
        return success

    def test_get_lesson(self):
        """Test getting a specific lesson"""
        if not self.lesson_id:
            print("❌ Cannot test get_lesson: No lesson ID available")
            return False
            
        success, response = self.run_test(
            "Get lesson by ID",
            "GET",
            f"lessons/{self.lesson_id}",
            200
        )
        return success

    def test_update_lesson(self):
        """Test updating a lesson"""
        if not self.lesson_id or not self.student_id:
            print("❌ Cannot test update_lesson: No lesson ID or student ID available")
            return False
            
        # Update the lesson for day after tomorrow
        day_after_tomorrow = datetime.now() + timedelta(days=2)
        start_time = day_after_tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
        end_time = day_after_tomorrow.replace(hour=15, minute=0, second=0, microsecond=0)
        
        success, response = self.run_test(
            "Update lesson",
            "PUT",
            f"lessons/{self.lesson_id}",
            200,
            data={
                "title": "Updated Test Lesson",
                "student_id": self.student_id,
                "subject": "Updated Test Subject",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "notes": "Updated test lesson notes"
            }
        )
        return success

    def test_delete_lesson(self):
        """Test deleting a lesson"""
        if not self.lesson_id:
            print("❌ Cannot test delete_lesson: No lesson ID available")
            return False
            
        success, response = self.run_test(
            "Delete lesson",
            "DELETE",
            f"lessons/{self.lesson_id}",
            200
        )
        return success

    def test_delete_student(self):
        """Test deleting a student"""
        if not self.student_id:
            print("❌ Cannot test delete_student: No student ID available")
            return False
            
        success, response = self.run_test(
            "Delete student",
            "DELETE",
            f"students/{self.student_id}",
            200
        )
        return success

def main():
    # Get the backend URL from the frontend .env file
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                backend_url = line.strip().split('=')[1].strip('"\'')
                break
    
    print(f"Using backend URL: {backend_url}")
    
    # Setup
    tester = TutorAppTester(backend_url)
    
    # Run tests
    print("\n===== AUTHENTICATION TESTS =====")
    if not tester.test_register():
        print("❌ Registration failed, stopping tests")
        return 1
        
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
        
    if not tester.test_get_tutor_profile():
        print("❌ Getting tutor profile failed")
    
    print("\n===== STUDENT MANAGEMENT TESTS =====")
    if not tester.test_create_student():
        print("❌ Student creation failed, stopping student tests")
    else:
        tester.test_get_students()
        tester.test_get_student()
        tester.test_update_student()
        tester.test_update_payment_status()
        tester.test_update_homework_status()
    
    print("\n===== LESSON MANAGEMENT TESTS =====")
    if tester.student_id:
        if not tester.test_create_lesson():
            print("❌ Lesson creation failed, stopping lesson tests")
        else:
            tester.test_get_lessons()
            tester.test_get_lesson()
            tester.test_update_lesson()
            tester.test_delete_lesson()
    else:
        print("❌ Cannot run lesson tests: No student ID available")
    
    print("\n===== CLEANUP TESTS =====")
    if tester.student_id:
        tester.test_delete_student()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
