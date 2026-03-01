# Student Dashboard Setup Guide

I've added the following features to the student dashboard:

## ✨ New Features

### 1. **Settings Modal** ⚙️
- Click the settings icon (⚙️) in the top navigation or click on your profile picture
- Edit your full name and bio
- Changes are saved to your Supabase user profile

### 2. **Profile Picture Upload** 📸
- In the settings modal, click "Upload Photo" to select and upload a profile picture
- Images are stored in Supabase Storage (`profile-pictures` bucket)
- Your profile picture displays in the top navigation and can be clicked to access settings

### 3. **Map View** 🗺️
- Toggle between "List" and "Map" views when viewing your events
- See all events plotted on an interactive map with their locations
- Requires `latitude` and `longitude` data in your event records

## ⚙️ Required Supabase Configuration

### Step 1: Create the Profile Pictures Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Storage** → **Buckets**
4. Click **Create a new bucket**
5. Name it: `profile-pictures`
6. Make it **public** (toggle the "Public bucket" option)
7. Click **Create bucket**

### Step 2: Set Storage Bucket Policies

In the **SQL Editor** of your Supabase dashboard, run the following SQL to set up RLS policies for the profile-pictures bucket:

```sql
-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Users can upload their own profile pictures
create policy "Users can upload their own profile pictures"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-pictures'
    and auth.uid()::text = (string_to_array(name, '_'))[1]
  );

-- Profile pictures are publicly readable
create policy "Profile pictures are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-pictures');

-- Users can update their own profile pictures
create policy "Users can update their own profile pictures"
  on storage.objects for update
  to authenticated
  with check (
    bucket_id = 'profile-pictures'
    and auth.uid()::text = (string_to_array(name, '_'))[1]
  );

-- Users can delete their own profile pictures
create policy "Users can delete their own profile pictures"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-pictures'
    and auth.uid()::text = (string_to_array(name, '_'))[1]
  );
```

## 🚀 How It Works

### Profile Picture Upload Flow
1. User selects an image file
2. File is uploaded to Supabase Storage (`profile-pictures` bucket)
3. Public URL is generated
4. URL is saved to user's metadata in Supabase Auth
5. Profile picture displays immediately in the UI

### Profile Update Flow
1. User edits full name and/or bio
2. Changes are saved to Supabase Auth user metadata
3. Changes persist across sessions

### Map View
- Shows all events with geolocation data
- Events must have `latitude` and `longitude` fields populated
- Displays attendee counts and event capacity

## 🔧 Technical Details

### Files Modified
- `frontend/lib/api.ts` - Added profile update and picture upload functions
- `frontend/app/dashboard/StudentDashboard.tsx` - Added settings modal, profile picture UI, and map view
- `supabase/schema.sql` - Added storage bucket configuration

### API Functions

#### `updateUserProfile(userData)`
```typescript
// Update user profile information
await updateUserProfile({
  full_name: 'John Doe',
  bio: 'Computer Science student',
  profile_picture_url: 'https://...'
});
```

#### `uploadProfilePicture(file)`
```typescript
// Upload a profile picture and get back the public URL
const result = await uploadProfilePicture(file);
console.log(result.url); // Public URL of the uploaded image
```

## 📝 Notes

- Profile pictures are stored with the naming pattern: `{userId}_{timestamp}_{filename}`
- Upsert is enabled, so uploading a new picture will replace the old one
- All profile pictures are public and can be viewed without authentication
- User metadata is stored in Supabase Auth and persists across sessions
- The map view requires events to have valid `latitude` and `longitude` values

## 🐛 Troubleshooting

### Getting 404 errors when updating profile
- Make sure you've applied all the SQL migrations
- Check that your Supabase project is properly configured
- Verify the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in your `.env.local`

### Profile picture not uploading
- Check that the `profile-pictures` bucket exists and is public
- Verify the RLS policies are properly set up
- Check browser console for specific error messages

### Map not displaying
- Ensure your events have `latitude` and `longitude` values
- Check that the MapView component is properly imported and working
