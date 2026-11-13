update storage.buckets set file_size_limit = 52428800, allowed_mime_types = array['image/jpeg','audio/mpeg','audio/wav','video/mp4'] where id = 'story-media';
